use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

const EMBEDDED_DATABASE: &[u8] = include_bytes!("../resources/pal-hub.sqlite");
const DATABASE_FILENAME: &str = "pal-hub.sqlite";
const DATABASE_SCHEMA: &str = "pal-hub-v1";

pub struct PalDatabase {
    connection: Mutex<Connection>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PalWikiEntry {
    id: String,
    number: String,
    name: String,
    slug: String,
    href: String,
    elements: Vec<String>,
    works: Vec<String>,
    work_levels: Vec<i64>,
    local_image: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PalElementImage {
    key: String,
    label: String,
    image_url: String,
    local_icon: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PalWorkImage {
    key: String,
    label: String,
    image_url: String,
    local_icon: String,
}

#[derive(Debug, Serialize)]
pub struct PalBreedingResult {
    parent1: String,
    parent2: String,
    child: String,
}

impl PalDatabase {
    pub fn new(app_data_dir: &Path) -> Result<Self, String> {
        std::fs::create_dir_all(app_data_dir).map_err(|error| error.to_string())?;
        let database_path = app_data_dir.join(DATABASE_FILENAME);
        ensure_database_file(&database_path, true)?;

        let connection = Connection::open(database_path).map_err(|error| error.to_string())?;
        validate_database(&connection)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    pub fn new_fallback() -> Result<Self, String> {
        let database_path = std::env::temp_dir().join(DATABASE_FILENAME);
        ensure_database_file(&database_path, false)?;

        let connection = Connection::open(database_path).map_err(|error| error.to_string())?;
        validate_database(&connection)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    pub fn get_pals(&self) -> Result<Vec<PalWikiEntry>, String> {
        let connection = self.connection()?;
        let mut statement = connection
            .prepare("SELECT id, number, name, slug, href, local_image FROM pals ORDER BY sort_index")
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                ))
            })
            .map_err(|error| error.to_string())?;

        let mut pals = Vec::new();
        for row in rows {
            let (id, number, name, slug, href, local_image) = row.map_err(|error| error.to_string())?;
            pals.push(PalWikiEntry {
                id,
                number: number.clone(),
                name,
                slug,
                href,
                elements: get_pal_elements(&connection, &number)?,
                works: get_pal_works(&connection, &number)?,
                work_levels: get_pal_work_levels(&connection, &number)?,
                local_image,
            });
        }

        Ok(pals)
    }

    pub fn get_element_images(&self) -> Result<Vec<PalElementImage>, String> {
        let connection = self.connection()?;
        let mut statement = connection
            .prepare("SELECT key, label, image_url, local_icon FROM pal_element_images ORDER BY sort_index")
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map([], |row| {
                Ok(PalElementImage {
                    key: row.get(0)?,
                    label: row.get(1)?,
                    image_url: row.get(2)?,
                    local_icon: row.get(3)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn get_work_images(&self) -> Result<Vec<PalWorkImage>, String> {
        let connection = self.connection()?;
        let mut statement = connection
            .prepare("SELECT key, label, image_url, local_icon FROM pal_work_images ORDER BY sort_index")
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map([], |row| {
                Ok(PalWorkImage {
                    key: row.get(0)?,
                    label: row.get(1)?,
                    image_url: row.get(2)?,
                    local_icon: row.get(3)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn get_breeding_results(&self) -> Result<Vec<PalBreedingResult>, String> {
        let connection = self.connection()?;
        let mut statement = connection
            .prepare(
                "SELECT parent1_number, parent2_number, child_number
                 FROM breeding_results
                 ORDER BY parent1_sort_index, parent2_sort_index",
            )
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map([], |row| {
                Ok(PalBreedingResult {
                    parent1: row.get(0)?,
                    parent2: row.get(1)?,
                    child: row.get(2)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    fn connection(&self) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
        self.connection
            .lock()
            .map_err(|_| "pal database lock poisoned".to_string())
    }
}

fn ensure_database_file(database_path: &PathBuf, create_parent: bool) -> Result<(), String> {
    if create_parent {
        if let Some(parent) = database_path.parent() {
            std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
    }

    let should_write = match Connection::open(database_path) {
        Ok(connection) => match get_schema(&connection) {
            Ok(schema) => schema.as_deref() != Some(DATABASE_SCHEMA),
            Err(_) => true,
        },
        Err(_) => true,
    };

    if should_write {
        std::fs::write(database_path, EMBEDDED_DATABASE).map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn validate_database(connection: &Connection) -> Result<(), String> {
    match get_schema(connection)?.as_deref() {
        Some(DATABASE_SCHEMA) => Ok(()),
        Some(schema) => Err(format!("unsupported pal database schema: {schema}")),
        None => Err("missing pal database schema".to_string()),
    }
}

fn get_schema(connection: &Connection) -> Result<Option<String>, String> {
    connection
        .query_row(
            "SELECT value FROM metadata WHERE key = 'schema'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())
}

fn get_pal_elements(connection: &Connection, number: &str) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare("SELECT element FROM pal_elements WHERE pal_number = ?1 ORDER BY position")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([number], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn get_pal_works(connection: &Connection, number: &str) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare("SELECT work_key FROM pal_works WHERE pal_number = ?1 ORDER BY position")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([number], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn get_pal_work_levels(connection: &Connection, number: &str) -> Result<Vec<i64>, String> {
    let mut statement = connection
        .prepare("SELECT work_level FROM pal_works WHERE pal_number = ?1 ORDER BY position")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([number], |row| row.get::<_, i64>(0))
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}
